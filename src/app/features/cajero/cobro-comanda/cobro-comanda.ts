import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cobro-comanda',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cobro-comanda.html',
  styleUrls: ['./cobro-comanda.scss']
})
export class CobroComandaComponent {
  mesas = [
    { id: 8, nombre: 'Mesa 8 - Salón Central', comanda: 1042, estado: 'Esperando Ticket de Pago', monto: 540.00 },
    { id: 4, nombre: 'Gab 4 - Zona Gabinetes Premium', comanda: 1039, estado: 'Esperando Ticket de Pago', monto: 1280.00 }
  ];

  mesaSeleccionada = this.mesas[0];

  seleccionarMesa(mesa: any): void {
    this.mesaSeleccionada = mesa;
  }

  // CAMBIA AQUÍ: de cobrar() a procesarCobro()
  procesarCobro(metodo: string): void {
    if (!this.mesaSeleccionada) return;
    alert(`Cobro de $${this.mesaSeleccionada.monto} procesado con ${metodo} para ${this.mesaSeleccionada.nombre}`);
    this.mesas = this.mesas.filter(m => m.id !== this.mesaSeleccionada.id);
    this.mesaSeleccionada = this.mesas[0] || null;
  }

  dividirCuenta(): void {
    if (!this.mesaSeleccionada) return;
    alert(`Dividiendo cuenta para ${this.mesaSeleccionada.nombre}`);
  }

  aplicarDescuento(): void {
    if (!this.mesaSeleccionada) return;
    alert(`Aplicando descuento a ${this.mesaSeleccionada.nombre}`);
  }
}