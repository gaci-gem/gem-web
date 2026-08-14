import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@/environments/environment';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.BASE_URL || !req.url.startsWith(environment.BASE_URL)) return next(req);
  return next(req.clone({ withCredentials: true }));
};
