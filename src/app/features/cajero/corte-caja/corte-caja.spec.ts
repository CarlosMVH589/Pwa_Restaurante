import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CorteCajaComponent } from './corte-caja';

describe('CorteCajaComponent', () => {
  let component: CorteCajaComponent;
  let fixture: ComponentFixture<CorteCajaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorteCajaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CorteCajaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
