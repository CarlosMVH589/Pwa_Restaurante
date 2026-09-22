import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ReportesVentasComponent } from './reportes-ventas';

describe('ReportesVentasComponent', () => {
  let component: ReportesVentasComponent;
  let fixture: ComponentFixture<ReportesVentasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesVentasComponent, FormsModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesVentasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería calcular el total de transacciones', () => {
    expect(component.transaccionesCount).toBe(26);
  });
});
//comentario