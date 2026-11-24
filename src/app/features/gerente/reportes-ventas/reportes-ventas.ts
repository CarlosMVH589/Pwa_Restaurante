import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { RestaurantApiService } from '../../../core/orders/restaurant-api.service';

interface VentaProducto {
  id: number;
  producto: string;
  categoria: string;
  unidades: number;
  total: number;
}

interface TopProducto {
  posicion: number;
  nombre: string;
  monto: number;
  porcentajeAncho: number;
}
//comentario

@Component({
  selector: 'app-reportes-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-ventas.html',
  styleUrl: './reportes-ventas.scss'
})
export class ReportesVentasComponent implements OnInit {
  fechaSeleccionada: string = 'hoy';
  turnoSeleccionado: string = 'completo';

  ventasTotales = 0;
  ticketPromedio = 0;
  transaccionesCount = 0;
  topProductos: TopProducto[] = [];
  detalleVentas: VentaProducto[] = [];
  error = '';

  constructor(
    private readonly router: Router,
    private readonly api: RestaurantApiService,
    private readonly auth: AuthService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.auth.isBrowser) return;
    try {
      const reporte = await this.api.reporteVentas(this.fechaSeleccionada, this.turnoSeleccionado);
      this.ventasTotales = reporte.ventasTotales;
      this.ticketPromedio = reporte.ticketPromedio;
      this.transaccionesCount = reporte.transacciones;
      this.topProductos = reporte.top;
      this.detalleVentas = reporte.detalle.map((fila, i) => ({ id: i + 1, ...fila }));
      this.error = '';
    } catch {
      this.error = 'No se pudo cargar el reporte.';
    }
    this.cdr.markForCheck();
  }


  volverDashboard(): void {
    this.router.navigate(['/gerente']);
  }

  exportarPDF(): void {
    console.log('Exportando reporte a PDF...');
  }

  exportarExcel(): void {
    console.log('Exportando reporte a Excel...');
  }
}