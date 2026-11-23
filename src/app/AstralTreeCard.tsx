import React from 'react';
import { observer } from 'mobx-react-lite';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Box from '@mui/material/Box';

interface CardAstralTree {
  filename: string;
  openFile: () => void;
  showFileInFolder: () => void;
  remove: () => void;
}

export interface AstralTreeCardProps {
  astralTree: CardAstralTree;
}

function AstralTreeCard( {
  astralTree,
}: AstralTreeCardProps ): React.JSX.Element {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>( null );

  function handleMenuClick( event: React.MouseEvent<HTMLElement> ): void {
    setAnchorEl( event.currentTarget );
  }

  function handleMenuClose(): void {
    setAnchorEl( null );
  }

  function closeMenuAndRun( callback: () => void ): () => void {
    return () => {
      callback();
      setAnchorEl( null );
    };
  }

  const Content = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        marginLeft: '-10px',
      }}
    >
      <Box>
        <Box display="flex" flexWrap="wrap" alignItems="center"></Box>
      </Box>
    </Box>
  );

  return (
    <Card
      sx={{
        backgroundColor: ( theme ) => theme.palette.input.light,
        border: ( theme ) => `1px solid ${theme.palette.input.border}`,
        width: '550px',
        height: '200px',
      }}
    >
      <CardHeader
        sx={{
          overflow: 'hidden',
          '& .MuiCardHeader-content': {
            overflow: 'hidden',
          },
        }}
        avatar={
          <Chip
            sx={{
              height: '30px',
              color: ( theme ) => theme.palette.input.contrastText,
              backgroundColor: ( theme ) => theme.palette.input.main,
              border: ( theme ) => `1px solid ${theme.palette.input.darker}`,
            }}
            label={'trees'}
            color="secondary"
          />
        }
        action={
          <div>
            <Tooltip aria-label="remove-astralTree" title="Remove input trees">
              <IconButton onClick={astralTree.remove} size="large">
                <DeleteForeverIcon />
              </IconButton>
            </Tooltip>

            <IconButton
              aria-owns={anchorEl
                ? 'astralTree-menu'
                : undefined}
              aria-haspopup="true"
              onClick={handleMenuClick}
              size="large"
            >
              <MoreVertIcon />
            </IconButton>

            <Menu
              id="astralTree-menu"
              anchorEl={anchorEl}
              open={Boolean( anchorEl )}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={closeMenuAndRun( astralTree.openFile )}>
                Open input trees
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun( astralTree.showFileInFolder )}>
                Show in folder
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun( astralTree.remove )}>
                Remove input trees
              </MenuItem>
            </Menu>
          </div>
        }
        title={astralTree.filename}
        subheader={'Input trees'}
        style={{ paddingBottom: 4 }}
      />
      <CardContent>{Content}</CardContent>
      <CardActions></CardActions>
    </Card>
  );
}

const AstralTreeCardObserver = observer( AstralTreeCard );

export default AstralTreeCardObserver;
