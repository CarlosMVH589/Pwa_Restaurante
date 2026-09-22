import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ConfiguracionTurnosComponent } from './configuracion-turnos';
//comentario
describe('ConfiguracionTurnosComponent', () => {
  let component: ConfiguracionTurnosComponent;
  let fixture: ComponentFixture<ConfiguracionTurnosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionTurnosComponent, FormsModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracionTurnosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar las categorías con empleados y sus turnos', () => {
    expect(component.categorias.length).toBeGreaterThan(0);
    const primerEmpleado = component.categorias[0].empleados[0];
    expect(primerEmpleado.turnosSemana['LUNES']).toBeDefined();
  });

  it('debería alternar los turnos al hacer clic (Matutino -> Vespertino -> Libre -> Matutino)', () => {
    const empleado = component.categorias[0].empleados[0];
    const dia = 'LUNES';

    expect(empleado.turnosSemana[dia].tipo).toBe('Matutino');

    component.cambiarTurno(empleado, dia);
    expect(empleado.turnosSemana[dia].tipo).toBe('Vespertino');

    component.cambiarTurno(empleado, dia);
    expect(empleado.turnosSemana[dia].tipo).toBe('Libre');

    component.cambiarTurno(empleado, dia);
    expect(empleado.turnosSemana[dia].tipo).toBe('Matutino');
  });
});