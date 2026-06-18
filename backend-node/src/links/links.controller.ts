import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { LinksService } from "./links.service";
import { IsUrl, IsString, IsOptional, IsIn } from "class-validator";

export class CreateLinkDto {
  @IsUrl()
  url: string;

  @IsString()
  source: string;

  @IsOptional()
  @IsString()
  context_text?: string;
}

export class UpdateLinkStatusDto {
  @IsIn(["ACTIVE", "ARCHIVED", "FAILED"])
  status: string;
}

@ApiTags("links")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("links")
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @Throttle({ ingest: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Submit a new link for processing" })
  async create(@Body() dto: CreateLinkDto, @Request() req) {
    return this.linksService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get paginated inbox of links" })
  async findAll(
    @Request() req,
    @Query("status") status?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
    @Query("category") category?: string,
  ) {
    return this.linksService.findAll(req.user.userId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit),
      category,
    });
  }

  @Put(":id/status")
  @ApiOperation({ summary: "Update the status of a link" })
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateLinkStatusDto,
    @Request() req,
  ) {
    return this.linksService.updateStatus(id, req.user.userId, dto.status);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft-delete a link" })
  async softDelete(@Param("id") id: string, @Request() req) {
    return this.linksService.softDelete(id, req.user.userId);
  }

  @Post(":id/reanalyze")
  @Throttle({ ingest: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Re-trigger AI analysis for a link" })
  async reanalyze(@Param("id") id: string, @Request() req) {
    return this.linksService.reanalyze(id, req.user.userId);
  }

  @Get(":id/why-did-i-save-this")
  @ApiOperation({ summary: "Reconstruct context for a saved link" })
  async whyDidISaveThis(@Param("id") id: string, @Request() req) {
    return this.linksService.reconstructContext(id, req.user.userId);
  }
}