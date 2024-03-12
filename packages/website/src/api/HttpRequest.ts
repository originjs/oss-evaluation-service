import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'

enum Code {
  SUCCESS = 200,
  SERVER_ERROR = 500,
  HANDLE_SEPARATELY = 1,
}

export type ResultData<T> = {
  code: Code
  data: T
  msg: string
}

export class HttpRequest {
  service: AxiosInstance

  public constructor(config: AxiosRequestConfig) {
    this.service = axios.create(config)
    this.service.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        return config
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )
    this.service.interceptors.response.use(
      (response: AxiosResponse) => {
        const { data } = response
        if (data.code === Code.HANDLE_SEPARATELY) {
          return Promise.reject(data)
        }
        if (data.code !== Code.SUCCESS) {
          ElMessage.error(data.msg || 'Request failed')
          return Promise.reject(data)
        }
        return data
      },
      (error: AxiosError) => {
        const { response } = error
        if (response) {
          ElMessage.error('Request failed')
        } else if (!window.navigator.onLine) {
          ElMessage.error('Network connection failed')
        }
        return Promise.reject(error)
      }
    )
  }

  get<T>(url: string, params?: Object): Promise<ResultData<T>> {
    return this.service.get(url, params)
  }
  post<T>(url: string, params?: Object, config?: AxiosRequestConfig): Promise<ResultData<T>> {
    return this.service.post(url, params, config)
  }
}

const defaultConfig = {
  baseURL: '',
  timeout: 3000,
  withCredentials: true,
}

export default new HttpRequest(defaultConfig)

export const HttpRequestLong = new HttpRequest({
  ...defaultConfig,
  timeout: 0,
})
