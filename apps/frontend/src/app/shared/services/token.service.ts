import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly LOCAL_STORAGE_KEY = 'token';

  saveToken(value: string) {
    localStorage.setItem(this.LOCAL_STORAGE_KEY, value);
  }

  getToken() {
    return localStorage.getItem(this.LOCAL_STORAGE_KEY) ?? 'none';
  }

  isLoggedIn() {
    return !!localStorage.getItem(this.LOCAL_STORAGE_KEY);
  }

  deleteToken() {
    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
  }
}
