import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import type { UpdateDownload } from '../../common/rendererBridge';

export interface UpdateDownloadDialogProps {
  download: UpdateDownload;
}

function dialogCopy( download: UpdateDownload ): { percent?: number; text: string; detail: string } {
  switch ( download.status ) {
    case 'connecting':
      return { text: 'Starting…', detail: 'Connecting to the update server…' };
    case 'downloading':
    case 'restarted':
      if ( download.percent < 100 ) {
        return {
          percent: download.percent,
          text: `${Math.round( download.percent )}%`,
          detail: download.status === 'restarted'
            ? 'Retrying with the full download…'
            : 'RAxML-GUI will quit and install when the download finishes.',
        };
      }
      break;
    default:
  }
  return { percent: 100, text: '100%', detail: 'Download complete. Preparing to install…' };
}

export default function UpdateDownloadDialog( { download }: UpdateDownloadDialogProps ): React.JSX.Element | null {
  if ( download.status === 'idle' ) {
    return null;
  }
  const { percent, text, detail } = dialogCopy( download );
  return (
    <Dialog open={true} maxWidth="xs" fullWidth disableEscapeKeyDown aria-labelledby="update-download-title">
      <DialogTitle id="update-download-title">Downloading update</DialogTitle>
      <DialogContent>
        <LinearProgress
          variant={percent === undefined
            ? 'indeterminate'
            : 'determinate'}
          value={percent}
        />
        <Typography variant="body2" sx={{ mt: 1 }}>{text}</Typography>
        <Typography variant="body2" color="text.secondary">{detail}</Typography>
      </DialogContent>
    </Dialog>
  );
}
