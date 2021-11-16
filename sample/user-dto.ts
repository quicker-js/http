import { Prop } from '@quicker-js/class-transformer';
import { ApiProperty } from '../src/decorators/api-property';
import { ApiRequest } from '../src';
import { UserVo } from './user-vo';

@ApiRequest({
  url: '/user/{id}',
  method: 'post',
  description: '修改用户',
  scene: 'UserVO',
  response: UserVo,
})
/**
 * @class UserDto
 */
export class UserDto {
  @Prop.default
  @ApiProperty({
    description: 'ID',
    in: 'path',
    required: true,
  })
  public id: number;

  @Prop.default
  @ApiProperty({
    description: 'name',
    in: 'query',
    required: true,
  })
  public name: string;

  @Prop.default
  @ApiProperty({
    description: 'name',
    in: 'query',
    required: true,
  })
  public password: string;
}
