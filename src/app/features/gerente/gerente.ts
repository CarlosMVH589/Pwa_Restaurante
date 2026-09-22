import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface AlertaInventario {
  producto: string;
  cantidad: string;
  nivel: 'critico' | 'bajo';
  imagen: string;
}

interface Denominacion {
  denominacion: string;
  valor: number;
  cantidad: number;
}

@Component({
  selector: 'app-gerente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './gerente.html',
  styleUrls: ['./gerente.scss']
})
export class GerenteComponent implements OnInit {

  constructor(private readonly router: Router, private readonly location: Location) {}

  regresar(): void {
    this.location.back();
  }

  ventasTarjeta: number = 2800.00;
  ventasEfectivo: number = 3450.00;

  get ventasTotales(): number {
    return this.ventasTarjeta + this.ventasEfectivo;
  }

  alertasInventario: AlertaInventario[] = [
    {
      producto: 'Pan para Hamburguesa',
      cantidad: '5 pzas',
      nivel: 'critico',
      imagen: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png'
    },
    {
      producto: 'Jitomates',
      cantidad: '2.5 kg',
      nivel: 'bajo',
      imagen: 'https://cdn-icons-png.flaticon.com/512/1202/1202125.png'
    }
  ];

  tabulador: Denominacion[] = [
    { denominacion: '$500 Billetes', valor: 500, cantidad: 1 },
    { denominacion: '$200 Billetes', valor: 200, cantidad: 20 },
    { denominacion: '$100 Billetes', valor: 100, cantidad: 1 },
    { denominacion: '$10 Monedas', valor: 10, cantidad: 5 },
    { denominacion: '$5 Monedas', valor: 5, cantidad: 0 }
  ];
//comentario
  totalArqueado: number = 0;
  diferencia: number = 0;

  cajeroRelevo: string = 'Juan P.';
  fechaRelevo: string = '24/05/2024';
  horaRelevo: string = '17:30';
  observaciones: string = '';

  ngOnInit(): void {
    this.recalcularArqueo();
  }

  recalcularArqueo(): void {
    this.totalArqueado = this.tabulador.reduce((acc, item) => acc + (item.valor * (item.cantidad || 0)), 0);
    this.diferencia = this.totalArqueado - this.ventasEfectivo;
  }

  onSalir(): void {
    console.log('Cerrando sesión...');
    this.router.navigate(['/login']);
  }

  gestionarMenu(): void {
    this.router.navigate(['/gerente/gestionar-menu']);
  }

  reportesVentas(): void {
    this.router.navigate(['/gerente/reportes-ventas']);
  }

  configuracionTurnos(): void {
    this.router.navigate(['/gerente/configuracion-turnos']);
  }

  validarYFirmar(): void {
    this.router.navigate(['/gerente/validar-arqueo']);
  }
}