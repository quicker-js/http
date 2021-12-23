/**
 * MIT License
 * Copyright (c) 2021 YunlongRan<549510622@qq.com> quicker-js/http
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Axios, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ClassMirror } from '@quicker-js/class-decorator';
import classTransformer from '@quicker-js/class-transformer';

import { ApiPropertyMetadata, ApiRequestMetadata } from '../../metadatas';

import defaults from 'axios/lib/defaults';
import mergeConfig from 'axios/lib/core/mergeConfig';

/**
 * @class HttpClient
 */
export class HttpClient extends Axios {
  /**
   * 创建HttpClient实例
   * @param config
   */
  public static create(config?: AxiosRequestConfig): HttpClient {
    return new HttpClient(mergeConfig(defaults, config));
  }

  /**
   * 解析请求参数
   * @param data
   * @param config
   */
  public static parseConfig<D extends {} = any>(
    data: D,
    config: AxiosRequestConfig<D> = {}
  ): {
    config: AxiosRequestConfig<D>;
    metadata: ApiRequestMetadata[];
  } {
    const classMirror = ClassMirror.reflect(data.constructor);
    const filter = Array.from(classMirror.allMetadata).filter(
      (o) => o instanceof ApiRequestMetadata
    );
    filter.forEach((o: ApiRequestMetadata) => {
      config.url = o.metadata.url;
      config.method = o.metadata.method;
      const newData: Record<PropertyKey, any> = {};
      const propertyMirrors = classMirror.getPropertyMirrors(true);
      propertyMirrors.forEach((propertyMirror) => {
        const value = data[propertyMirror.propertyKey as keyof D];
        if (value !== undefined) {
          propertyMirror.metadata.forEach((m) => {
            if (m instanceof ApiPropertyMetadata) {
              if (m.metadata.in === 'path') {
                config.url = o.metadata.url.replace(
                  new RegExp(`{s*${propertyMirror.propertyKey as string}s*}`),
                  value as any
                );
              } else if (m.metadata.in === 'header') {
                config.headers = config.headers || {};
                config.headers[propertyMirror.propertyKey as any] =
                  value as any;
              } else {
                newData[propertyMirror.propertyKey] = value;
              }
            }
          });
        }
      });

      if (['post', 'put', 'patch'].includes(config.method)) {
        config.data = newData;
      }

      // nobody
      if (['delete', 'get', 'head', 'options'].includes(config.method)) {
        config.params = newData;
      }
    });
    if (!filter.length) {
      throw new TypeError('Invalid ApiRequestMetadata.');
    }

    return {
      config,
      metadata: filter,
    };
  }

  /**
   * 转换响应数据
   * @param metadata
   * @param data
   */
  public static transform<T = any, M extends ApiRequestMetadata = any>(
    metadata: M[],
    data: T
  ): T {
    metadata.forEach((o: ApiRequestMetadata) => {
      if (
        o.metadata.response &&
        (o.metadata.response as any).constructor === Function
      ) {
        if (Array.isArray(data)) {
          data = classTransformer.plainToInstanceList(
            o.metadata.response,
            data,
            {
              scene: o.metadata.scene,
            }
          ) as any;
        } else {
          data = classTransformer.plainToInstance(o.metadata.response, data, {
            scene: o.metadata.scene,
          });
        }
      }
    });
    return data;
  }

  /**
   * 发起请求
   * @param data 此字段必须是带有@ApiRequest的class实例
   * @param config
   */
  public async fetch<T = any, D extends {} = any>(
    data: D,
    config: AxiosRequestConfig<D> = {}
  ): Promise<AxiosResponse<T, D>> {
    const parseConfig = HttpClient.parseConfig(data, config);
    try {
      const response = await this.request(parseConfig.config);
      response.data = HttpClient.transform(parseConfig.metadata, response.data);
      return response;
    } catch (e) {
      throw e;
    }
  }
}
