import { useJsonSchemaToJson } from './hooks/use-json-schema-to-json'
import { ApiEndpoint } from '@/types/endpoint'
import { Panel } from '@motiadev/ui'
import { FC } from 'react'
import { JsonEditor } from './json-editor'
import ReactJson from 'react18-json-view'
import 'react18-json-view/src/dark.css'
import 'react18-json-view/src/style.css'
import { convertJsonSchemaToJson } from './hooks/utils'
type Props = {
  endpoint: ApiEndpoint
  onChange?: (body: string) => void
  onValidate?: (isValid: boolean) => void
  panelName: string
}

export const EndpointBodyPanel: FC<Props> = ({ endpoint, onChange, onValidate, panelName }) => {
  const shouldHaveBody = ['post', 'put', 'patch'].includes(endpoint.method.toLowerCase())
  const { body, setBody } = useJsonSchemaToJson(endpoint.bodySchema)

  const handleBodyChange = (body: string) => {
    setBody(body)
    onChange?.(body)
  }

  if (!shouldHaveBody) {
    return null
  }

  return (
    <Panel title="Body" size="sm" contentClassName="p-0" data-testid={`endpoint-body-panel__${panelName}`}>
      {onChange ? (
        <JsonEditor value={body} schema={endpoint.bodySchema} onChange={handleBodyChange} onValidate={onValidate} />
      ) : (
        <ReactJson
          src={convertJsonSchemaToJson(endpoint.bodySchema)}
          theme="default"
          enableClipboard={false}
          style={{ backgroundColor: 'transparent' }}
        />
      )}
    </Panel>
  )
}
