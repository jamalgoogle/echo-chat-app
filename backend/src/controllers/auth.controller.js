import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { signToken } from '../middleware/auth.js';
import { httpError } from '../middleware/error.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicUser = (u) => ({ id: u.id, email: u.email, username: u.username, avatar: u.avatar });

export async function register(req, res) {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const username = String(req.body.username ?? '').trim();
  const password = String(req.body.password ?? '');

  if (!EMAIL_RE.test(email)) throw httpError(400, 'Enter a valid email address');
  if (!/^[\w.-]{3,24}$/.test(username))
    throw httpError(400, 'Username must be 3–24 characters: letters, numbers, dot, dash or underscore');
  if (password.length < 8 || password.length > 72)
    throw httpError(400, 'Password must be 8–72 characters');

  try {
    const user = await prisma.user.create({
      data: { email, username, password: await bcrypt.hash(password, 12) },
    });
    res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
  } catch (err) {
    if (err.code === 'P2002') throw httpError(409, 'That email or username is already taken');
    throw err;
  }
}

export async function login(req, res) {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) throw httpError(401, 'Incorrect email or password');
  res.json({ token: signToken(user.id), user: publicUser(user) });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw httpError(401, 'Account no longer exists');
  res.json({ user: publicUser(user) });
}
