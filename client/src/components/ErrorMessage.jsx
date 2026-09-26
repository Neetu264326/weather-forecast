import Icon from './Icon'

const ICON_BY_TYPE = {
  notfound: 'pin',
  network: 'alert',
  api: 'alert',
  validation: 'search',
  limit: 'clock',
  location: 'navigation',
}

const TITLE_BY_TYPE = {
  notfound: 'City not found',
  network: 'Connection problem',
  api: 'Service unavailable',
  validation: 'Check your search',
  limit: 'Slow down a little',
  location: 'Location unavailable',
}

export default function ErrorMessage({
  type = 'api',
  message,
  title,
  onRetry,
  compact = false,
}) {
  return (
    <div className={`state${compact ? ' state--compact' : ''}`} role="alert">
      <span className="state__icon">
        <Icon name={ICON_BY_TYPE[type] ?? 'alert'} />
      </span>
      <div>
        <p className="state__title">{title ?? TITLE_BY_TYPE[type] ?? 'Something went wrong'}</p>
        <p className="state__text">
          {message ??
            (type === 'notfound'
              ? "We couldn't find that city."
              : type === 'network'
                ? 'Unable to connect. Please try again.'
                : 'Weather service is temporarily unavailable.')}
        </p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          <Icon name="refresh" size={16} /> Try again
        </button>
      )}
    </div>
  )
}
