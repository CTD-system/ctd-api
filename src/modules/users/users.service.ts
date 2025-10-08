import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User,UserRole } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // users.service.ts
const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
const newUser = this.userRepo.create({
  username: createUserDto.username,
  email: createUserDto.email,
  password_hash: hashedPassword,
  role: createUserDto.role
      ? (createUserDto.role as UserRole)
      : UserRole.USUARIO, // valor por defecto
});

    return this.userRepo.save(newUser);
  }

  // ✅ Listar todos los usuarios
  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  // ✅ Buscar usuario por ID
  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    return user;
  }

  // ✅ Actualizar usuario
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.userRepo.save(user);
  }

  // ✅ Eliminar usuario
  async remove(id: string): Promise<void> {
    const result = await this.userRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
  }
}
