import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { authConfig } from '../config/auth';

interface ITokenPayload {
  iat: number;
  exp: number;
  sub: string;
}

export function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token JWT ausente.' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = verify(token, authConfig.jwt.secret);

    const { sub } = decoded as ITokenPayload;

    // Injeta de forma segura o ID obtido do 'sub' para os próximos passos
    req.user = {
      id: sub,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token JWT inválido ou expirado.' });
  }
}
