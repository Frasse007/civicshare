// Authentication business logic. Knows nothing about Express which makes it unit-testable and reusable.
import bcrypt from 'bcryptjs';
import { UniqueConstraintError } from 'sequelize';
import { User, ROLES } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/tokens.js';

const BCRYPT_ROUNDS = 10;
/** Pre-computed hash compared against when the email is unknown, so response time
 *  does not reveal which emails are registered (user-enumeration defence).
 */
const DUMMY_HASH = bcrypt.hashSync('civicshare-dummy-password', BCRYPT_ROUNDS);

export async function registerUser({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
    // Role is fixed server-side: public registration can only ever create members.
    const user = await User.create({ name, email, passwordHash, role: ROLES.MEMBER });
    return { user: user.toPublic(), token: signToken(user) };
  } catch (err) {
    if (err instanceof UniqueConstraintError) throw AppError.conflict('An account with that email already exists');
    throw err;
  }
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ where: { email } });
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) throw AppError.unauthorized('Invalid email or password');
  return { user: user.toPublic(), token: signToken(user) };
}

export async function getUserById(id) {
  const user = await User.findByPk(id);
  if (!user) throw AppError.unauthorized('Account no longer exists');
  return user.toPublic();
}
