import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class CustomRPCExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    console.log('RPC Exception Filter');
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const rpcError = exception.getError() as any;
    if (typeof rpcError === 'object' && rpcError.message && rpcError.status) {
      return response.status(rpcError.status).json({
        statusCode: rpcError.status,
        message: rpcError.message,
      });
    }

    console.log('RPC Error:', rpcError);
    return response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}
