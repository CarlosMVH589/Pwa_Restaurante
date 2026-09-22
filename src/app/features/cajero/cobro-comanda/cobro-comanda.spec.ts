import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CobroComanda } from './cobro-comanda';

describe('CobroComanda', () => {
  let component: CobroComanda;
  let fixture: ComponentFixture<CobroComanda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CobroComanda],
    }).compileComponents();

    fixture = TestBed.createComponent(CobroComanda);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
