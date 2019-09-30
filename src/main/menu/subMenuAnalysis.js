const subMenuAnalysis = {
    label: 'Analysis',
    submenu: [
      {
        label: 'Select multiple outgroup...',
        click() {
          console.log(this);
        }
      },
      {
        label: 'Exclude sites...',
        accelerator: 'CommandOrControl+E',
        click() {
          console.log(this);
        }
      },
      {
        label: 'Set/Edit partitions...',
        accelerator: 'CommandOrControl+P',
        click() {
          console.log(this);
        }
      },
      {
        label: 'Delete partitions',
        click() {
          console.log(this);
        }
      },
      {
        label: 'Export partition file',
        click() {
          console.log(this);
        }
      },
      { type: 'separator' },
      {
        label: 'Save memory search (+F)',
        click() {
          console.log(this);
        }
      },
      { type: 'separator' },
      {
        label: 'Load additional files...',
        submenu: [
          {
            label: 'Load secondary structure...',
            type: 'radio'
          },
          {
            label: 'Load starting tree',
            type: 'radio'
          }
        ]
      },
      {
        label: 'Enforce constraint...',
        submenu: [
          {
            label: 'Load binary constraint',
            type: 'radio'
          },
          {
            label: 'Load multifurcating constraint',
            type: 'radio'
          },
          {
            label: 'Define topological constraint...',
            type: 'radio'
          }
        ]
      },
      {
        label: 'Consensus trees...',
        submenu: [
          {
            label: 'Majority rule',
            type: 'radio'
          },
          {
            label: 'Extended majority rule',
            type: 'radio'
          },
          {
            label: 'Strict consensus',
            type: 'radio'
          },
          {
            label: 'Majority rule - Dropset',
            type: 'radio'
          },
          {
            label: 'Strict consensus - Dropset',
            type: 'radio'
          }
        ]
      },
      {
        label: 'Additional analyses...',
        submenu: [
          {
            label: 'Robinson Foulds tree distances',
            type: 'radio'
          },
          {
            label: 'Per site log Likelihoods',
            type: 'radio'
          },
          {
            label: 'SH-like support value computation',
            type: 'radio'
          }
        ]
      }
    ]
  };

export default subMenuAnalysis;
