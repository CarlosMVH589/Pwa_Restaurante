import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CobroComandaComponent } from './cobro-comanda';

describe('CobroComandaComponent', () => {
  let component: CobroComandaComponent;
  let fixture: ComponentFixture<CobroComandaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CobroComandaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CobroComandaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
