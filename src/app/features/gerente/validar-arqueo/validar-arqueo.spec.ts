import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { vi } from 'vitest';
import { ValidarArqueoComponent } from './validar-arqueo';

describe('ValidarArqueoComponent', () => {
  let component: ValidarArqueoComponent;
  let fixture: ComponentFixture<ValidarArqueoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ValidarArqueoComponent,
        FormsModule,
        RouterTestingModule.withRoutes([
          { path: 'gerente', component: ValidarArqueoComponent }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ValidarArqueoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería calcular la diferencia correctamente', () => {
    component.efectivoSistema = 3450;
    component.efectivoArqueado = 5450;
    expect(component.diferencia).toBe(2000);
    expect(component.esSobrante).toBe(true);
  });

  it('debería emitir auditoriaFinalizada al enviar un formulario válido', () => {
    const spy = vi.spyOn(component.auditoriaFinalizada, 'emit');

    component.justificacion = 'Justificación válida de prueba';
    component.pinGerente = '1234';
    component.confirmado = true;

    component.firmarYFinalizar();
    expect(component.mostrarFirma).toBe(true);

    component.firmaNombre = 'Gerardo R.';
    component.firmaConfirmada = true;
    component.confirmarFirma();

    expect(spy).toHaveBeenCalledWith({
      justificacion: 'Justificación válida de prueba',
      pin: '1234',
      diferencia: 2000
    });
  });

  it('debería emitir cerrarModal al presionar cerrar o regresar', () => {
    const spy = vi.spyOn(component.cerrarModal, 'emit');

    component.onCerrar();
    expect(spy).toHaveBeenCalledTimes(1);

    component.regresarAConteo();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});