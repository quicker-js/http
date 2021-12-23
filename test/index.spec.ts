import 'reflect-metadata';
import { describe, it } from 'mocha';
import { HttpClient } from '../';

describe('index.spec.ts', () => {
  const httpClient = HttpClient.create({
    baseURL: 'http://localhost:8000',
  });
  it('should ', function () {
    console.log(httpClient);
    // httpClient
    //   .fetch(
    //     classTransformer.plainToInstance(UserDto, {
    //       id: 1,
    //       name: '张三',
    //       password: '123456',
    //     })
    //   )
    //   .then((res) => {
    //     console.log(res);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
  });
});
