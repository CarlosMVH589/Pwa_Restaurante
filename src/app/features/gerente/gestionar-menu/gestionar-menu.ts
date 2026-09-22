import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Platillo {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  estado: 'Disponible' | 'Agotado';
  pausado: boolean;
}

interface Categoria {
  nombre: string;
  count: number;
}

@Component({
  selector: 'app-gestionar-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionar-menu.html',
  styleUrl: './gestionar-menu.scss'
})
export class GestionarMenuComponent {
  constructor(private readonly router: Router) {}

  searchTerm: string = '';
  selectedCategoriaFilter: string = '';
  activeSidebarCategory: string = 'Hamburguesas & Snacking';
  mostrarFormulario = false;
  nuevoPlatillo = {
    nombre: '',
    categoria: 'Hamburguesas & Snacking',
    precio: 0
  };

  categorias: Categoria[] = [
    { nombre: 'Hamburguesas & Snacking', count: 12 },
    { nombre: 'Sopas & Entradas', count: 5 },
    { nombre: 'Bebidas', count: 8 },
    { nombre: 'Postres', count: 6 }
  ];

  platillos: Platillo[] = [
    { id: 1, nombre: 'Hamburguesa BBQ Extra', categoria: 'Hamburguesas & Snacking', precio: 120.00, estado: 'Disponible', pausado: false },
    { id: 2, nombre: 'Sopa Azteca Tradicional', categoria: 'Sopas & Entradas', precio: 80.00, estado: 'Disponible', pausado: false },
    { id: 3, nombre: 'Carne de Res Preparada', categoria: 'Platillos Fuertes', precio: 150.00, estado: 'Agotado', pausado: false }
  ];

  selectCategory(catName: string) {
    this.activeSidebarCategory = catName;
  }

  get filteredPlatillos(): Platillo[] {
    return this.platillos.filter(platillo => {
      const matchesSearch = platillo.nombre.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = this.selectedCategoriaFilter 
        ? platillo.categoria === this.selectedCategoriaFilter 
        : true;
      return matchesSearch && matchesCategory;
    });
  }

  mostrarFormularioAgregar() {
    this.mostrarFormulario = true;
  }

  agregarPlatillo() {
    const nombre = this.nuevoPlatillo.nombre.trim();

    if (!nombre || this.nuevoPlatillo.precio <= 0) {
      return;
    }

    this.platillos.push({
      id: Math.max(...this.platillos.map(platillo => platillo.id), 0) + 1,
      nombre,
      categoria: this.nuevoPlatillo.categoria,
      precio: this.nuevoPlatillo.precio,
      estado: 'Disponible',
      pausado: false
    });

    const categoria = this.categorias.find(item => item.nombre === this.nuevoPlatillo.categoria);
    if (categoria) {
      categoria.count += 1;
    }

    this.cancelarAgregar();
  }

  cancelarAgregar() {
    this.mostrarFormulario = false;
    this.nuevoPlatillo = {
      nombre: '',
      categoria: 'Hamburguesas & Snacking',
      precio: 0
    };
  }

  editarPlatillo(platillo: Platillo) {
    const nuevoPrecio = Number(window.prompt('Precio del platillo:', String(platillo.precio)));

    if (Number.isFinite(nuevoPrecio) && nuevoPrecio > 0) {
      platillo.precio = nuevoPrecio;
    }
  }

  togglePausar(platillo: Platillo) {
    platillo.pausado = !platillo.pausado;
  }

  volverDashboard() {
    this.router.navigate(['/gerente']);
  }
}