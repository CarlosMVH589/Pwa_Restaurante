import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface MesaCuenta {
  id: number;
  nombre: string;
  comanda: number;
  estado: string;
  monto: number;
}

@Component({
  selector: 'app-cajero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cajero.html',
  styleUrls: ['./cajero.scss']
})
export class CajeroPage {

  // Cuentas pendientes
  mesas: MesaCuenta[] = [
    { id: 8, nombre: 'Mesa 8 - Salón Central', comanda: 1042, estado: 'Esperando Ticket de Pago', monto: 540.00 },
    { id: 4, nombre: 'Gab 4 - Zona Gabinetes Premium', comanda: 1039, estado: 'Esperando Ticket de Pago', monto: 1280.00 }
  ];

  mesaSeleccionada: MesaCuenta | null = this.mesas[0];

  // Totales de Arqueo y Cierre
  fondoInicial: number = 1500.00;
  efectivoVentas: number = 4850.00;
  tarjetaVentas: number = 3120.00;
  efectivoCapturado: number = 6350.00;

  // Propiedad calculada para el total esperado en caja (Fondo + Efectivo)
  get totalEsperado(): number {
    return this.fondoInicial + this.efectivoVentas;
  }

  // Propiedad calculada para determinar la diferencia en tiempo real
  get diferencia(): number {
    return this.efectivoCapturado - this.totalEsperado;
  }

  seleccionarMesa(mesa: MesaCuenta): void {
    this.mesaSeleccionada = mesa;
  }

  calcularDiferencia(): void {
    // Se ejecuta al modificar manualmente el input de Efectivo Físico
  }

  // Método principal que suma las ventas
  procesarPago(metodo: 'Efectivo' | 'Tarjeta'): void {
    if (!this.mesaSeleccionada) {
      alert('Por favor selecciona una mesa para cobrar.');
      return;
    }

    const montoCobrado = this.mesaSeleccionada.monto;

    if (metodo === 'Efectivo') {
      // Incrementa ventas en efectivo y ajusta el efectivo contado por defecto
      this.efectivoVentas += montoCobrado;
      this.efectivoCapturado += montoCobrado;
    } else if (metodo === 'Tarjeta') {
      // Incrementa únicamente ventas con tarjeta
      this.tarjetaVentas += montoCobrado;
    }

    alert(`¡Cobro exitoso con ${metodo}!\nMesa: ${this.mesaSeleccionada.nombre}\nMonto cobrado: $${montoCobrado.toFixed(2)} MXN`);

    // Remover la mesa cobrada y seleccionar la siguiente si existe
    this.mesas = this.mesas.filter(m => m.id !== this.mesaSeleccionada?.id);
    this.mesaSeleccionada = this.mesas.length > 0 ? this.mesas[0] : null;
  }

  dividirCuenta(): void {
    if (!this.mesaSeleccionada) return;
    alert(`Procesando división de cuenta para ${this.mesaSeleccionada.nombre}`);
  }

  aplicarDescuento(): void {
    if (!this.mesaSeleccionada) return;
    alert(`Aplicando descuento a ${this.mesaSeleccionada.nombre}`);
  }

  imprimirTicket(): void {
    alert('Imprimiendo ticket de ventas para el relevo de turno...');
  }
}