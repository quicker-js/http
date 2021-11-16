import 'reflect-metadata';
import { describe, it } from 'mocha';
import { HttpClient } from '../src/lib/http-client';
import classTransformer from '@quicker-js/class-transformer';
import { UserDto } from '../sample';

describe('index.spec.ts', () => {
  const httpClient = HttpClient.create({
    baseURL: 'http://localhost:8000',
  });
  it('should ', function () {
    httpClient
      .fetch(
        classTransformer.plainToInstance(UserDto, {
          id: 1,
          name: '张三',
          password: '123456',
        })
      )
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  });
});
