import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AlumnoService } from './services/alumno';
import { Alumno, AlumnoPaginado } from './models/alumno.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

//librerias para reporte
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePipe, FormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly alumnoService = inject(AlumnoService);
  protected readonly resultado = signal<AlumnoPaginado | null>(null);
  protected readonly cargando = signal<boolean>(false);
  protected readonly error = signal<boolean>(false);
  protected readonly paginaActual = signal<number>(1);
  protected readonly totalPaginas = signal<number>(0);
  protected readonly totalRegistros = signal<number>(0);
  protected readonly paginas = computed(() =>
    Array.from({ length: this.totalPaginas() }, (_, i) => i + 1)
  );

  protected readonly alumnoSeleccionado = signal<Alumno | null>(null);
  private alumnoBackup: Alumno | null = null;
  protected readonly esEdicion = signal<boolean>(false);

  // Subject para el debounce con RxJS
  private readonly busquedaSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Debounce: espera 400ms después de que el usuario deja de escribir
    this.busquedaSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(), // no llama si el texto no cambió
      takeUntil(this.destroy$)
    ).subscribe(texto => {
      this.alumnoService.filtroNombre.set(texto);
      this.cargarAlumnos(1);
    });

    this.cargarAlumnos(1);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Se llama en cada tecla del input
  protected onBusquedaChange(texto: string): void {
    this.busquedaSubject.next(texto);
  }

  protected cargarAlumnos(pagina: number): void {
    this.cargando.set(true);
    this.error.set(false);

    const filtro = this.alumnoService.filtroNombre().trim();

    if (filtro) {
      this.alumnoService.buscarPorNombre(filtro).subscribe({
        next: (datos) => {
          this.resultado.set({
            totalRegistros: datos.length,
            paginaActual: 1,
            totalPaginas: 1,
            datos
          });
          this.paginaActual.set(1);
          this.totalPaginas.set(1);
          this.totalRegistros.set(datos.length);
          this.cargando.set(false);
        },
        error: () => { this.error.set(true); this.cargando.set(false); }
      });
    } else {
      this.alumnoService.listarPaginado(pagina, 10).subscribe({
        next: (res) => {
          this.resultado.set(res);
          this.paginaActual.set(res.paginaActual);
          this.totalPaginas.set(res.totalPaginas);
          this.totalRegistros.set(res.totalRegistros);
          this.cargando.set(false);
        },
        error: () => { this.error.set(true); this.cargando.set(false); }
      });
    }
  }

  protected irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaActual.set(pagina);
    this.cargarAlumnos(pagina);
  }

  protected limpiarBusqueda(): void {
    this.alumnoService.filtroNombre.set('');
    this.busquedaSubject.next('');
    this.cargarAlumnos(1);
  }

  protected seleccionarAlumno(alumno: Alumno): void {
    this.esEdicion.set(false);
    const alumnoConvertido = {
      ...alumno,
      anula: Boolean(alumno.anula) // ← convierte 0/1 a false/true
    };
    this.alumnoBackup = { ...alumno };
    this.alumnoSeleccionado.set({ ...alumno });
  }

  protected habilitarEdicion(): void { this.esEdicion.set(true); }

  protected cancelarEdicion(): void {
    if (this.alumnoBackup) this.alumnoSeleccionado.set({ ...this.alumnoBackup });
    this.esEdicion.set(false);
  }

  protected cerrarModal(): void {
    this.esEdicion.set(false);
    this.alumnoSeleccionado.set(null);
    this.alumnoBackup = null;
  }

  protected guardar(): void {
    const alumnoEditado = this.alumnoSeleccionado();
    if (!alumnoEditado) return;

    this.alumnoService.actualizarAlumno(alumnoEditado.codigoAlumno, alumnoEditado)
      .subscribe({
        next: () => {
          this.alumnoBackup = { ...alumnoEditado };
          this.esEdicion.set(false);
          this.cargarAlumnos(this.paginaActual());
        },
        error: (err) => console.error('Error al actualizar:', err)
      });
  }

  protected anularAlumno(alumno: Alumno): void {
    const alumnoAnulado = { ...alumno, anula: true };
  
    this.alumnoService.actualizarAlumno(alumnoAnulado.codigoAlumno, alumnoAnulado)
      .subscribe({
        next: () => {
          console.log('Alumno anulado correctamente');
          this.cerrarModal();
          this.cargarAlumnos(this.paginaActual());
        },
        error: (err) => console.error('Error al anular:', err)
      });
  }

  protected exportarExcel(): void {
    const datos = this.resultado()?.datos ?? [];
    const ws = XLSX.utils.json_to_sheet(datos.map(a => ({
      'Código': a.codigoAlumno,
      'Nombres': a.nombres,
      'Tipo Certificado': a.tipoCertificado,
      'Fecha Ingreso': new Date(a.fechaIngreso).toLocaleDateString('es-PE'),
      'Estado': a.estado,
      'Anulado': a.anula ? 'Sí' : 'No'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), `alumnos_pagina_${this.paginaActual()}.xlsx`);
  }
  
  protected exportarPDF(): void {
    const datos = this.resultado()?.datos ?? [];
    const doc = new jsPDF();
    doc.text('Listado de Alumnos', 14, 10);
    autoTable(doc, {
      head: [['Código', 'Nombres', 'Tipo Certificado', 'Fecha Ingreso', 'Estado', 'Anulado']],
      body: datos.map(a => [
        a.codigoAlumno,
        a.nombres,
        a.tipoCertificado,
        new Date(a.fechaIngreso).toLocaleDateString('es-PE'),
        a.estado,
        a.anula ? 'Sí' : 'No'
      ])
    });
    doc.save(`alumnos_pagina_${this.paginaActual()}.pdf`);
  }
}