import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface Turno {
  id: string;
  tipo: 'Matutino' | 'Vespertino' | 'Libre';
  horario: string;
}

export interface Empleado {
  id: number;
  nombre: string;
  rol: 'CAJEROS' | 'COCINEROS' | 'GERENCIA';
  turnosSemana: { [dia: string]: Turno };
}

export interface CategoriaRol {
  rol: 'CAJEROS' | 'COCINEROS' | 'GERENCIA';
  empleados: Empleado[];
}

@Component({
  selector: 'app-configuracion-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion-turnos.html',
  styleUrl: './configuracion-turnos.scss'
})
export class ConfiguracionTurnosComponent {
  mostrarFormularioTurno = false;
  empleadoSeleccionadoId = 1;
  diaSeleccionado = 'LUNES';
  turnoSeleccionadoId = 'matutino';

  diasSemana: string[] = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];

  turnosOpciones: Turno[] = [
    { id: 'matutino', tipo: 'Matutino', horario: '(08:00 - 16:00)' },
    { id: 'vespertino', tipo: 'Vespertino', horario: '(16:00 - 24:00)' },
    { id: 'libre', tipo: 'Libre', horario: 'DESCANSO' }
  ];

  categorias: CategoriaRol[] = [
    {
      rol: 'CAJEROS',
      empleados: [
        {
          id: 1,
          nombre: 'Pedro G.',
          rol: 'CAJEROS',
          turnosSemana: this.generarSemanaConTurno('Matutino')
        },
        {
          id: 2,
          nombre: 'María O.',
          rol: 'CAJEROS',
          turnosSemana: this.generarSemanaConTurno('Vespertino')
        }
      ]
    },
    {
      rol: 'COCINEROS',
      empleados: [
        {
          id: 3,
          nombre: 'Juan P.',
          rol: 'COCINEROS',
          turnosSemana: this.generarSemanaConTurno('Matutino')
        },
        {
          id: 4,
          nombre: 'Carlos M.',
          rol: 'COCINEROS',
          turnosSemana: this.generarSemanaConTurno('Vespertino')
        }
      ]
    },
    {
      rol: 'GERENCIA',
      empleados: [
        {
          id: 5,
          nombre: 'Gerardo R.',
          rol: 'GERENCIA',
          turnosSemana: this.generarSemanaConTurno('Matutino')
        }
      ]
    }
  ];

  constructor(private readonly router: Router) {}

  private generarSemanaConTurno(tipoTurno: 'Matutino' | 'Vespertino'): { [dia: string]: Turno } {
    const semana: { [dia: string]: Turno } = {};
    const turnoBase = this.turnosOpciones.find(t => t.tipo === tipoTurno)!;
    this.diasSemana.forEach(dia => {
      semana[dia] = { ...turnoBase };
    });
    return semana;
  }

  cambiarTurno(empleado: Empleado, dia: string): void {
    const turnoActual = empleado.turnosSemana[dia].tipo;
    if (turnoActual === 'Matutino') {
      empleado.turnosSemana[dia] = { ...this.turnosOpciones.find(t => t.tipo === 'Vespertino')! };
    } else if (turnoActual === 'Vespertino') {
      empleado.turnosSemana[dia] = { ...this.turnosOpciones.find(t => t.tipo === 'Libre')! };
    } else {
      empleado.turnosSemana[dia] = { ...this.turnosOpciones.find(t => t.tipo === 'Matutino')! };
    }
  }

  volverDashboard(): void {
    this.router.navigate(['/gerente']);
  }

  asignarNuevoTurno(): void {
    this.mostrarFormularioTurno = true;
  }

  confirmarNuevoTurno(): void {
    const empleado = this.buscarEmpleado(this.empleadoSeleccionadoId);
    const turno = this.turnosOpciones.find(opcion => opcion.id === this.turnoSeleccionadoId);

    if (!empleado || !turno) {
      return;
    }

    empleado.turnosSemana[this.diaSeleccionado] = { ...turno };
    this.cancelarNuevoTurno();
  }

  cancelarNuevoTurno(): void {
    this.mostrarFormularioTurno = false;
  }

  private buscarEmpleado(id: number): Empleado | undefined {
    return this.categorias
      .flatMap(categoria => categoria.empleados)
      .find(empleado => empleado.id === id);
  }

  verHistorialRelevos(): void {
    console.log('Abrir modal/vista de historial de relevos');
  }

  guardarCambios(): void {
    console.log('Cambios guardados con éxito', this.categorias);
    alert('¡Cambios de horario guardados correctamente!');
  }
}