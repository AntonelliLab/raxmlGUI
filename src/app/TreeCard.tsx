import React from 'react';
import { observer } from 'mobx-react-lite';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

interface CardTree {
  name: string;
  openFile: () => void;
  openFolder: () => void;
  remove: () => void;
}

export interface TreeCardProps {
  tree: CardTree;
  sx?: SxProps<Theme>;
}

function TreeCard( { sx, tree }: TreeCardProps ): React.JSX.Element {
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

  return (
    <Card
      raised
      sx={{
        backgroundColor: ( theme ) => theme.palette.input.main,
        border: ( theme ) => `1px solid ${theme.palette.input.light}`,
        ...sx,
      }}
    >
      <CardHeader
        avatar={
          <Chip
            label="tree"
            color="secondary"
            sx={{
              height: '30px',
              color: ( theme ) => theme.palette.input.contrastText,
              backgroundColor: ( theme ) => theme.palette.input.main,
              border: ( theme ) => `1px solid ${theme.palette.input.darker}`,
            }}
          />
        }
        action={
          <Box>
            <IconButton
              aria-owns={anchorEl
                ? 'tree-menu'
                : undefined}
              aria-haspopup="true"
              onClick={handleMenuClick}
              size="large"
            >
              <MoreVertIcon />
            </IconButton>

            <Menu
              id="tree-menu"
              anchorEl={anchorEl}
              open={Boolean( anchorEl )}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={closeMenuAndRun( tree.openFile )}>
                Show tree
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun( tree.openFolder )}>
                Show folder
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun( tree.remove )}>Remove</MenuItem>
            </Menu>
          </Box>
        }
        title={tree.name}
        subheader={''}
      />
      <CardContent></CardContent>
    </Card>
  );
}
// <Box display="flex" alignItems="center" justifyContent="center">{tree.name}</Box>

export default observer( TreeCard );
