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
  public static create(
    config?: AxiosRequestConfig & { allowTransformer?: boolean }
  ): HttpClient {
    const httpClient = new HttpClient(mergeConfig(defaults, config));
    if (config) {
      httpClient.allowTransformer = Boolean(config.allowTransformer);
    }
    return httpClient;
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
    const filter = classMirror.getMetadata(ApiRequestMetadata);

    filter.forEach((o: ApiRequestMetadata) => {
      config.url = o.metadata.url;
      config.method = o.metadata.method;
      config.headers = config.headers = {};
      if (o.metadata.contentType) {
        config.headers['Content-Type'] = o.metadata.contentType;
      }
      const newData: Record<PropertyKey, any> = {};
      const propertyMirrors = classMirror.getAllProperties();
      propertyMirrors.forEach((propertyMirror) => {
        const value = data[propertyMirror.propertyKey as keyof D] as any;
        if (value !== undefined && value !== '') {
          propertyMirror.getAllMetadata().forEach((m) => {
            if (m instanceof ApiPropertyMetadata) {
              if (m.metadata.in === 'path') {
                config.url = o.metadata.url.replace(
                  new RegExp(`{s*${propertyMirror.propertyKey as string}s*}`),
                  value
                );
              } else if (m.metadata.in === 'header') {
                config.headers = config.headers || {};
                config.headers[propertyMirror.propertyKey as any] = value;
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
   * @param response
   */
  public static transform<
    M extends ApiRequestMetadata = any,
    T extends AxiosResponse = any
  >(metadata: M[], response: T): T {
    metadata.forEach((o: ApiRequestMetadata) => {
      if (
        o.metadata.response &&
        (o.metadata.response as any).constructor === Function
      ) {
        if (Array.isArray(response.data)) {
          response.data = classTransformer.plainToInstanceList(
            o.metadata.response,
            response.data,
            {
              scene: o.metadata.scene,
            }
          );
        } else {
          response.data = classTransformer.plainToInstance(
            o.metadata.response,
            response.data,
            {
              scene: o.metadata.scene,
            }
          );
        }
      }
    });
    return response;
  }

  public allowTransformer = true;

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
      if (this.allowTransformer) {
        return HttpClient.transform(parseConfig.metadata, response);
      }
      return response;
    } catch (e) {
      throw e;
    }
  }
}
