import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginPage } from './login';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('usuarioActivo');
  });

  it('debería mostrar un error con credenciales inválidas', () => {
    component.usuario = 'cajero';
    component.contrasena = 'incorrecta';

    component.iniciarSesion();

    expect(component.errorMessage).toBe('Usuario o contraseña incorrectos.');
    expect(localStorage.getItem('usuarioActivo')).toBeNull();
  });

  it('debería guardar la sesión y navegar al panel del rol', async () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');
    component.usuario = 'cocina';
    component.contrasena = 'cocina123';

    component.iniciarSesion();
    await fixture.whenStable();

    expect(localStorage.getItem('usuarioActivo')).toBe('cocina');
    expect(navigateSpy).toHaveBeenCalledWith('/cocina');
  });
});
