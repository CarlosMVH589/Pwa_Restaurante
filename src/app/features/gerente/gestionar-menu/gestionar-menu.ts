import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import {
  IngredienteStock,
  PlatilloMenu,
  RestaurantApiService,
  mensajeError,
} from '../../../core/orders/restaurant-api.service';

interface Categoria {
  nombre: string;
  count: number;
}

interface LineaFormulario {
  ingredienteId: number | null;
  cantidad: number;
}

@Component({
  selector: 'app-gestionar-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionar-menu.html',
  styleUrl: './gestionar-menu.scss'
})
export class GestionarMenuComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly api: RestaurantApiService,
    private readonly auth: AuthService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  readonly secciones = ['Hamburguesas & Snacking', 'Sopas & Entradas', 'Platillos Fuertes', 'Bebidas', 'Postres'];

  searchTerm = '';
  selectedCategoriaFilter = '';
  mostrarFormulario = false;
  editandoId: number | null = null;
  guardando = false;
  error = '';
  aviso = '';
  platillos: PlatilloMenu[] = [];
  ingredientes: IngredienteStock[] = [];
  formulario = this.formularioVacio();

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.auth.isBrowser) return;
    try {
      const [menu, ingredientes] = await Promise.all([this.api.menuAdmin(), this.api.ingredientes()]);
      this.platillos = menu;
      this.ingredientes = ingredientes;
    } catch (error) {
      this.error = mensajeError(error);
    }
    this.cdr.markForCheck();
  }

  get categorias(): Categoria[] {
    return this.secciones.map((nombre) => ({
      nombre,
      count: this.platillos.filter((platillo) => platillo.seccion === nombre).length,
    }));
  }

  get activeSidebarCategory(): string {
    return this.selectedCategoriaFilter;
  }

  selectCategory(catName: string): void {
    this.selectedCategoriaFilter = this.selectedCategoriaFilter === catName ? '' : catName;
  }

  get filteredPlatillos(): PlatilloMenu[] {
    return this.platillos.filter((platillo) => {
      const matchesSearch = platillo.nombre.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = this.selectedCategoriaFilter ? platillo.seccion === this.selectedCategoriaFilter : true;
      return matchesSearch && matchesCategory;
    });
  }

  resumenReceta(platillo: PlatilloMenu): string {
    if (!platillo.receta.length) return 'Sin receta: no descuenta inventario';
    return platillo.receta.map((linea) => `${linea.nombre} x${linea.cantidad}`).join(', ');
  }

  unidadDe(ingredienteId: number | null): string {
    return this.ingredientes.find((ingrediente) => ingrediente.id === ingredienteId)?.unidad ?? '';
  }

  mostrarFormularioAgregar(): void {
    this.editandoId = null;
    this.formulario = this.formularioVacio();
    this.error = '';
    this.aviso = '';
    this.mostrarFormulario = true;
  }

  editarPlatillo(platillo: PlatilloMenu): void {
    this.editandoId = platillo.id;
    this.formulario = {
      nombre: platillo.nombre,
      seccion: platillo.seccion,
      precio: platillo.precio,
      receta: platillo.receta.map((linea) => ({ ingredienteId: linea.ingredienteId, cantidad: linea.cantidad })),
    };
    this.error = '';
    this.aviso = '';
    this.mostrarFormulario = true;
  }

  agregarLineaReceta(): void {
    this.formulario.receta.push({ ingredienteId: null, cantidad: 1 });
  }

  quitarLineaReceta(indice: number): void {
    this.formulario.receta.splice(indice, 1);
  }

  async guardarPlatillo(): Promise<void> {
    const nombre = this.formulario.nombre.trim();
    if (!nombre || !(this.formulario.precio > 0)) {
      this.error = 'Escribe el nombre y un precio mayor a 0.';
      return;
    }

    const receta = this.formulario.receta
      .filter((linea) => linea.ingredienteId !== null && linea.cantidad > 0)
      .map((linea) => ({ ingredienteId: linea.ingredienteId as number, cantidad: Number(linea.cantidad) }));
    const entrada = { nombre, precio: Number(this.formulario.precio), seccion: this.formulario.seccion, receta };

    this.guardando = true;
    this.error = '';
    try {
      if (this.editandoId === null) await this.api.crearPlatillo(entrada);
      else await this.api.actualizarPlatillo(this.editandoId, entrada);
      this.aviso = this.editandoId === null ? `"${nombre}" se agregó al menú.` : `"${nombre}" se actualizó.`;
      await this.cargar();
      this.cancelarAgregar();
    } catch (error) {
      this.error = mensajeError(error);
    }
    this.guardando = false;
    this.cdr.markForCheck();
  }

  cancelarAgregar(): void {
    this.mostrarFormulario = false;
    this.editandoId = null;
    this.formulario = this.formularioVacio();
  }

  async togglePausar(platillo: PlatilloMenu): Promise<void> {
    try {
      await this.api.platilloDisponible(platillo.id, !platillo.disponible);
      platillo.disponible = !platillo.disponible;
      this.error = '';
    } catch (error) {
      this.error = mensajeError(error);
    }
    this.cdr.markForCheck();
  }

  volverDashboard(): void {
    this.router.navigate(['/gerente']);
  }

  private formularioVacio(): { nombre: string; seccion: string; precio: number; receta: LineaFormulario[] } {
    return { nombre: '', seccion: this.secciones[0], precio: 0, receta: [] };
  }
}
