export interface Alumno{
    codigoAlumno: number;
    nombres: string;
    tipoCertificado: string;
    fechaIngreso: Date;
    estado: string;
    anula: boolean; 
}

export interface AlumnoPaginado {
    totalRegistros: number;
    paginaActual: number;
    totalPaginas: number;
    datos: Alumno[];
}