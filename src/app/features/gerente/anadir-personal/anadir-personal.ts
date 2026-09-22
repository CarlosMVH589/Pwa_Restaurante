import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Personal {
  id: number;
  nombre: string;
  rol: 'CAJERO' | 'COCINERO' | 'MESERO' | 'HOST';
  telefono: string;
  turno: 'Matutino' | 'Vespertino';
}

@Component({
  selector: 'app-anadir-personal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './anadir-personal.html',
  styleUrl: './anadir-personal.scss'
})
export class AnadirPersonalComponent {
  constructor(private readonly router: Router) {}

  personal: Personal[] = [
    { id: 1, nombre: 'Pedro G.', rol: 'CAJERO', telefono: '555 010 1200', turno: 'Matutino' },
    { id: 2, nombre: 'María O.', rol: 'COCINERO', telefono: '555 010 1201', turno: 'Vespertino' }
  ];

  nuevoPersonal = {
    nombre: '',
    rol: 'CAJERO' as Personal['rol'],
    telefono: '',
    turno: 'Matutino' as Personal['turno']
  };

  mensaje = '';

  agregarPersonal(): void {
    const nombre = this.nuevoPersonal.nombre.trim();
    if (!nombre) {
      this.mensaje = 'Escribe el nombre del empleado para continuar.';
      return;
    }

    this.personal.push({
      id: Math.max(...this.personal.map(persona => persona.id), 0) + 1,
      nombre,
      rol: this.nuevoPersonal.rol,
      telefono: this.nuevoPersonal.telefono.trim() || 'Sin teléfono',
      turno: this.nuevoPersonal.turno
    });

    this.mensaje = `${nombre} fue añadido al personal.`;
    this.nuevoPersonal = {
      nombre: '',
      rol: 'CAJERO',
      telefono: '',
      turno: 'Matutino'
    };
  }

  volverDashboard(): void {
    this.router.navigate(['/gerente']);
  }
}
