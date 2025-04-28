import { IUser } from './user';

export interface IAuthService {
  // register(userData: Omit<IUser, 'password'> & { password: string }): Promise<{
  //   token: string;
  //   refreshToken: string;
  //   user: Omit<IUser, 'password'>;
  // }>; // [Password registration archived: now handled by Firebase Auth]


  login(credentials: { email: string; password: string }): Promise<{
    token: string;
    refreshToken: string;
    user: Omit<IUser, 'password'>;
  }>;

  verifyToken(token: string): Promise<Omit<IUser, 'password'>>;

  refreshToken(refreshToken: string): Promise<{
    token: string;
    refreshToken: string;
  }>;

  logout(userId: string): Promise<void>;

  forgotPassword(email: string): Promise<void>;

  resetPassword(token: string, newPassword: string): Promise<void>;

  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}
