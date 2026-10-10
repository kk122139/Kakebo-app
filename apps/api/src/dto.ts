import { ValidateBy } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  Matches,
  IsIn,
  IsOptional,
  IsUUID,
} from "class-validator";
export class RegisterDto {
  @ApiProperty() @IsEmail() @MaxLength(254) email!: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @ApiProperty()
  @IsString()
  @ValidateBy({
    name: "bcryptByteLimit",
    validator: {
      validate: (v: unknown) =>
        typeof v === "string" && Buffer.byteLength(v, "utf8") <= 72,
      defaultMessage: () => "Contraseña demasiado larga: máximo 72 bytes UTF-8",
    },
  })
  @MinLength(10)
  @MaxLength(72)
  password!: string;
}
export class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MaxLength(72) password!: string;
}
export class TokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(30)
  @MaxLength(200)
  refreshToken!: string;
}
export class BudgetDto {
  @ApiProperty() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) month!: string;
  @ApiProperty() @IsInt() @Min(0) @Max(1000000000000) income!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(1000000000000) fixed!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(1000000000000) saving!: number;
}
export class ExpenseDto {
  @ApiProperty() @IsInt() @Min(1) @Max(1000000000000) amount!: number;
  @ApiProperty()
  @IsIn(["Supervivencia", "Ocio", "Cultura", "Extras"])
  category!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) description!: string;
  @ApiProperty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
  date!: string;
}
export class GoalDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(100) name!: string;
  @ApiProperty() @IsInt() @Min(1) @Max(1000000000000) target!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(1000000000000) saved!: number;
  @ApiProperty() @IsInt() @Min(1) @Max(1000000000000) monthly!: number;
}
export class ContributionDto {
  @ApiProperty() @IsInt() @Min(1) @Max(1000000000000) amount!: number;
}
export class SimulationDto {
  @ApiProperty() @IsInt() @Min(0) @Max(1000000000000) extra!: number;
}
export class ObjectiveDto {
  @ApiProperty()
  @IsIn([
    "Ahorrar más dinero",
    "Controlar mis gastos",
    "Planificar mis metas",
    "Conocer mis hábitos",
  ])
  objective!: string;
}
export class CloseDto {
  @ApiProperty() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) month!: string;
  @ApiProperty() @IsString() @MaxLength(2000) reflection!: string;
}
