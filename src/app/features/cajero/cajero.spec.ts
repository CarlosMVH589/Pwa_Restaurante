import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CajeroPage } from './pages/cajero/cajero';

describe('CajeroPage', () => {
  let component: CajeroPage;
  let fixture: ComponentFixture<CajeroPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CajeroPage]
    }).compileComponents();

    fixture = TestBed.createComponent(CajeroPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});