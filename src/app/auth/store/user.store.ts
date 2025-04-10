import { Injectable, signal } from "@angular/core";
import { UserInfo } from "../interfaces/user-info.interface";

@Injectable({ providedIn: 'root' })
export class UserStoreService {
  private _user = signal<UserInfo | null>(null);

  setUser(user: UserInfo) {
    this._user.set(user);
  }

  get user() {
    return this._user.asReadonly();
  }

  clearUser() {
    this._user.set(null);
  }
}
