import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AVATAR_POR_DEFECTO, getAvatarImage } from '@/app/constants/avatares-disponibles';
import { UsuarioService } from '@core/services/usuario';
import { DrawerService } from '@core/services/drawer.service';
import { EventoV2ActivityComponent } from './evento-v2-activity';

describe('EventoV2ActivityComponent', () => {
  let component: EventoV2ActivityComponent;
  let fixture: ComponentFixture<EventoV2ActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventoV2ActivityComponent],
      providers: [
        {
          provide: UsuarioService,
          useValue: { getAll: () => of([]) },
        },
        {
          provide: DrawerService,
          useValue: { abrirUsuarioDrawer: () => undefined },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventoV2ActivityComponent);
    component = fixture.componentInstance;
  });

  it('generates the default avatar for a comment user', () => {
    const user = {
      id: 'user-1',
      nombre: 'Ada',
      apellido: 'Lovelace',
      usuario: 'ada',
      color: '#336699',
    };

    expect(component.getCommentAvatar(user)).toBe(
      getAvatarImage(AVATAR_POR_DEFECTO, user),
    );
  });

  it('maps mention users to generated avatars using their persisted strategy', () => {
    const user = {
      id: 'user-1',
      nombre: 'Ada',
      apellido: 'Lovelace',
      email: 'ada@example.com',
      usuario: 'ada',
      color: '#336699',
      adicionales: [{ id: 1, clave: 'fotoPerfil', valor: 'email-v1' }],
    };
    const usuarioService = TestBed.inject(UsuarioService);
    spyOn(usuarioService, 'getAll').and.returnValue(of([user]) as any);

    component.ngOnInit();

    expect(component.usuarioOptions[0]).toEqual(jasmine.objectContaining({
      id: user.id,
      avatarImage: getAvatarImage('email-v1', user),
    }));
  });

  it('uses the persisted avatar strategy for a comment user', () => {
    const user = {
      id: 'user-1',
      nombre: 'Ada',
      apellido: 'Lovelace',
      usuario: 'ada',
      color: '#336699',
      adicionales: [{ id: 1, clave: 'fotoPerfil', valor: 'full-name-v1' }],
    };

    expect(component.getCommentAvatar(user)).toBe(
      getAvatarImage('full-name-v1', user),
    );
  });

  it('falls back to the default avatar for invalid or legacy strategies', () => {
    const user = {
      id: 'user-1',
      nombre: 'Ada',
      apellido: 'Lovelace',
      usuario: 'ada',
      color: '#336699',
      adicionales: [{ id: 1, clave: 'fotoPerfil', valor: '/legacy/avatar.png' }],
    };

    expect(component.getCommentAvatar(user)).toBe(
      getAvatarImage(AVATAR_POR_DEFECTO, user),
    );
  });

  it('generates a safe default avatar when the comment user is missing', () => {
    expect(component.getCommentAvatar()).toBe(getAvatarImage(AVATAR_POR_DEFECTO, {}));
  });
});
