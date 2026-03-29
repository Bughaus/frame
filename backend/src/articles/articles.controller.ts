import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('cash-register/articles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) { }

  @Get()
  findAll() {
    return this.articlesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Post()
  @Roles(Role.VORSTAND, Role.MITARBEITER)
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @Put(':id')
  @Roles(Role.VORSTAND, Role.MITARBEITER)
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Post(':id/image')
  @Roles(Role.VORSTAND, Role.MITARBEITER)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/articles',
      filename: (req, file, cb) => {
        const ext = file.originalname.split('.').pop();
        cb(null, `${req.params.id}.${ext}`);
      }
    })
  }))
  async uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const imageUrl = `/uploads/articles/${file.filename}`;
    return this.articlesService.update(id, { imageUrl } as any);
  }

  @Delete(':id')
  @Roles(Role.VORSTAND, Role.MITARBEITER)
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}
