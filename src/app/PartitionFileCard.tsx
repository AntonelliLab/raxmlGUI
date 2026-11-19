import React from 'react';
import { observer } from 'mobx-react-lite';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';

interface CardRun {
  havePartitionFile: boolean;
  partitionFileName: string;
  partitionFileContent: string;
  removePartitionFile: () => void;
}

export interface PartitionFileCardProps {
  run: CardRun;
}

function PartitionFileCard( {
  run,
}: PartitionFileCardProps ): React.JSX.Element | null {
  if ( !run.havePartitionFile ) {
    return null;
  }

  return (
    <Card
      sx={{
        backgroundColor: ( theme ) => theme.palette.input.light,
        border: ( theme ) => `1px solid ${theme.palette.input.border}`,
        height: '200px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardHeader
        avatar={
          <Chip
            sx={{
              height: '30px',
              color: ( theme ) => theme.palette.input.contrastText,
              backgroundColor: ( theme ) => theme.palette.input.main,
              border: ( theme ) => `1px solid ${theme.palette.input.darker}`,
            }}
            label="Partition"
            color="secondary"
          />
        }
        action={
          <div>
            <Chip
              sx={{
                backgroundColor: 'transparent',
                border: 'none',
                marginRight: '-5px',
                '& .MuiChip-deleteIcon': {
                  opacity: 1,
                },
              }}
              deleteIcon={<DeleteForeverIcon />}
              onDelete={run.removePartitionFile}
              title="Remove partition"
            />
          </div>
        }
        title={run.partitionFileName}
        style={{ paddingBottom: 4 }}
      />
      <CardContent style={{ flexGrow: 1, paddingTop: 5, paddingBottom: 5 }}>
        <Box
          sx={{
            overflowY: 'auto',
            height: '150px',
          }}
        >
          <Box
            component="code"
            sx={{
              color: ( theme ) => theme.palette.primary.contrastText,
              fontFamily:
                'Consolas, "Liberation Mono", Menlo, Courier, monospace',
              fontSize: '12px',
              height: '100%',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {run.partitionFileContent}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

const PartitionFileCardObserver = observer( PartitionFileCard );

export default PartitionFileCardObserver;
