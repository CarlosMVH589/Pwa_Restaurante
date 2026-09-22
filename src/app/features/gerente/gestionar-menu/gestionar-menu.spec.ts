import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { GestionarMenuComponent } from './gestionar-menu';

describe('GestionarMenuComponent', () => {
  let component: GestionarMenuComponent;
  let fixture: ComponentFixture<GestionarMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarMenuComponent, FormsModule],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(GestionarMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería filtrar platillos por término de búsqueda', () => {
    component.searchTerm = 'Sopa';
    fixture.detectChanges();
    
    const resultados = component.filteredPlatillos;
    expect(resultados.length).toBe(1);
    expect(resultados[0].nombre).toContain('Sopa Azteca Tradicional');
  });

  it('debería alternar el estado de pausado de un platillo', () => {
    const platillo = component.platillos[0];
    const estadoInicial = platillo.pausado;

    component.togglePausar(platillo);
    expect(platillo.pausado).toBe(!estadoInicial);

    component.togglePausar(platillo);
    expect(platillo.pausado).toBe(estadoInicial);
  });

  it('debería cambiar la categoría activa al seleccionar una', () => {
    const nuevaCategoria = 'Bebidas';
    component.selectCategory(nuevaCategoria);
    
    expect(component.activeSidebarCategory).toBe(nuevaCategoria);
  });
});