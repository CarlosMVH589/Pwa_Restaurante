import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { GerenteComponent } from './gerente';

describe('GerenteComponent', () => {
  let component: GerenteComponent;
  let fixture: ComponentFixture<GerenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ GerenteComponent, FormsModule, RouterTestingModule ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GerenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate total sales correctly', () => {
    component.ventasTarjeta = 2000;
    component.ventasEfectivo = 3000;
    expect(component.ventasTotales).toBe(5000);
  });

  it('should calculate arqueo total and difference correctly', () => {
    component.ventasEfectivo = 3000;
    component.tabulador = [
      { denominacion: '$500 Billetes', valor: 500, cantidad: 7 }
    ];
    component.recalcularArqueo();
    expect(component.totalArqueado).toBe(3500);
    expect(component.diferencia).toBe(500);
  });
});
//comentario