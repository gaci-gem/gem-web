import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { LoadingService } from '@core/services/loading.service';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import * as tablerIcons from '@ng-icons/tabler-icons'
import * as tablerIconsFill from '@ng-icons/tabler-icons/fill'
import * as lucideIcons from '@ng-icons/lucide'
import { provideIcons } from '@ng-icons/core';
import { filter, map, mergeMap } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { Toast, ToastModule } from "primeng/toast";
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { appTitle } from './constants';
import Clarity from '@microsoft/clarity';
import { PrimeNG } from 'primeng/config';
import { PRIMENG_ES } from './constants/primeng-es';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    LoadingSpinnerComponent,
    ToastModule,
    DynamicDialogModule
  ],
  providers: [
    MessageService,
    DialogService
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  viewProviders: [
    provideIcons({ ...tablerIcons, ...tablerIconsFill, ...lucideIcons }),
  ],
})
export class App implements OnInit {
  private titleService = inject(Title);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private loadingService = inject(LoadingService);
  private dialogService = inject(DialogService);
  private cdr = inject(ChangeDetectorRef);
  private primeng = inject(PrimeNG);
  isLoading = false;

  ngOnInit(): void {
    // Configuración de idioma español para PrimeNG
    this.primeng.setTranslation(PRIMENG_ES);

    // Clarity.init("tcuivyetkx");

    this.loadingService.loading$.subscribe((loading) => {
      this.isLoading = loading;
      this.cdr.detectChanges();
    });
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        mergeMap((route: any) => route.data)
      )
      .subscribe((data: any) => {
        if (data['title']) {
          this.titleService.setTitle(
            data['title'] + ' | ' + appTitle
          );
        }
      });
  }
}
