import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

@Component({
  selector: 'app-reportes-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-ventas.html',
  styleUrl: './reportes-ventas.scss'
})
export class ReportesVentasComponent {
  fechaSeleccionada: string = 'hoy';
  turnoSeleccionado: string = 'completo';

  ventasTotales: number = 6250.00;
  ticketPromedio: number = 245.00;
  transaccionesCount: number = 26;

  topProductos: TopProducto[] = [
    { posicion: 1, nombre: '1. Hamburguesa BBQ', monto: 6250.00, porcentajeAncho: 100 },
    { posicion: 2, nombre: '2. Sopa Azteca', monto: 245.00, porcentajeAncho: 75 },
    { posicion: 3, nombre: '3. Refrescos', monto: 245.00, porcentajeAncho: 55 },
    { posicion: 4, nombre: '4. Tacos Arrachera', monto: 145.00, porcentajeAncho: 40 },
    { posicion: 5, nombre: '5. Postres', monto: 100.00, porcentajeAncho: 28 }
  ];

  detalleVentas: VentaProducto[] = [
    { id: 1, producto: '1. Hamburguesa BBQ', categoria: 'Crítico', unidades: 1, total: 2800.00 },
    { id: 2, producto: '2. Sopa Azteca', categoria: 'Sopa', unidades: 20, total: 3450.00 },
    { id: 3, producto: '3. Refrescos', categoria: 'Refrescos', unidades: 3, total: 1200.00 },
    { id: 4, producto: '4. Tacos Arrachera', categoria: 'Tacos', unidades: 3, total: 1200.00 },
    { id: 5, producto: '5. Postres', categoria: 'Postres', unidades: 5, total: 600.00 },
    { id: 6, producto: '1. Hamburguesa BBQ', categoria: 'Categoría', unidades: 1, total: 1500.00 },
    { id: 7, producto: '2. Sopa Azteca', categoria: 'Sopa', unidades: 2, total: 245.00 },
    { id: 8, producto: '3. Refrescos', categoria: 'Refrescos', unidades: 1, total: 245.00 },
    { id: 9, producto: '4. Tacos Arrachera', categoria: 'Arrachera', unidades: 1, total: 300.00 },
    { id: 10, producto: '5. Postres', categoria: 'Postres', unidades: 1, total: 230.00 }
  ];

  constructor(private readonly router: Router) {}

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