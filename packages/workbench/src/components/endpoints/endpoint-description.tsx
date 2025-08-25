import { FC } from 'react'
import { EndpointResponseSchema } from './endpoint-response-schema'
import { ApiEndpoint } from '@/types/endpoint'
import { EndpointPathParamsPanel } from './endpoint-path-params-panel'
import { EndpointQueryParamsPanel } from './endpoint-query-params-panel'
import { EndpointBodyPanel } from './endpoint-body-panel'

type Props = { endpoint: ApiEndpoint }

export const EndpointDescription: FC<Props> = ({ endpoint }) => {
  return (
    <div className="space-y-3">
      <EndpointPathParamsPanel endpoint={endpoint} />
      <EndpointQueryParamsPanel endpoint={endpoint} />
      <EndpointBodyPanel endpoint={endpoint} panelName="details" />
      <EndpointResponseSchema
        items={Object.entries(endpoint?.responseSchema ?? {}).map(([status, schema]) => ({
          responseCode: status,
          bodySchema: schema,
        }))}
      />
    </div>
  )
}
