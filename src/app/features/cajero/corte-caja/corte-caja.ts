import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-corte-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './corte-caja.html',
  styleUrls: ['./corte-caja.scss']
})
export class CorteCajaComponent {
  fondoInicial = 1500;
  efectivoVentas = 4850;
  tarjetaVentas = 3120;
  efectivoCapturado = 6350;

  get totalEsperado(): number {
    return this.fondoInicial + this.efectivoVentas;
  }

  get diferencia(): number {
    return this.efectivoCapturado - this.totalEsperado;
  }

  imprimirTicket(): void {
    alert('Imprimiendo ticket de ventas para relevo de turno...');
  }
}