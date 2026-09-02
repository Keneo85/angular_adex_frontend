import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alumno, AlumnoPaginado } from '../models/alumno.interface';

@Injectable({ providedIn: 'root' })
export class AlumnoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5103/api/Alumnos';

  public readonly filtroNombre = signal<string>('');

  public listarPaginado(pagina: number, tamanio: number): Observable<AlumnoPaginado> {
    return this.http.get<AlumnoPaginado>(
      `${this.baseUrl}?pagina=${pagina}&tamanio=${tamanio}`
    );
  }

  public buscarPorNombre(nombre: string): Observable<Alumno[]> {
    return this.http.get<Alumno[]>(
      `${this.baseUrl}/buscar?nombre=${encodeURIComponent(nombre)}`
    );
  }

  public actualizarAlumno(id: number, alumno: Alumno): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, alumno);
  }
}