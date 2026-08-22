/* WHAT EACH PILOT COMPONENT IS MADE OF, written down.
 *
 * The layers used to be READ OFF THE TOKEN NAMES: cut the property tail off
 * --window-titlebar-active-bg, keep the first segment, call it a part. It cost
 * nothing to maintain and it was wrong about the component. Window came out as
 * WINDOW · CTRL · TITLE · TITLEBAR · EXPLAINER, five siblings in a row, when
 * the real thing is a titlebar holding a pair of controls holding a close
 * button. And a part that takes no tokens — the body, the resize grip — could
 * not exist at all, because the only evidence the derivation had was a token
 * name. A layers panel that can only show you the parts somebody happened to
 * name a colour after is describing the token file, not the component.
 *
 * So the anatomy is DECLARED here, one tree per pilot, and it mirrors the real
 * DOM: every node in it is an element on the bench, and every node carries the
 * name a designer would find in the Figma layer list. Adding a part is a line
 * in this file plus the `data-part` on the element it names, and the test holds
 * the two together in both directions — a node with no marker is a row you
 * cannot click, a marker with no node is a click that selects nothing.
 *
 * ROLES ARE PREFIXES, NOT LISTS. A node claims `titlebar` and every
 * --window-titlebar-* row lands on it, so a new titlebar token needs no edit
 * here. The component id is already off the front when the match runs, the
 * prefix has to end on a dash boundary (or be the whole name), and the LONGEST
 * claim wins: Wordmark takes `wordmark` and Version takes `wordmark-version`,
 * so --menubar-wordmark-version-text goes to the deeper of the two. A row no
 * node claims falls to the root, which is where a property of the component
 * itself belongs.
 *
 * TWO NODES MAY CLAIM THE SAME PREFIX. Close and Zoom are both `ctrl` —
 * the token file has one --window-ctrl-hover-bg and the component has two
 * buttons wearing it. Both nodes carry the row rather than the tree inventing
 * a CONTROL node nobody would recognise from the DOM.
 *
 * No 'use client' and no DOM: stylerBlocks.ts reads this in plain node, and
 * the panel is the only thing that needs a browser.
 */

/** One node of a declared anatomy. `id` is the element's `data-part` (the
    component id itself on the root, where `data-component` is the marker);
    `name` is a copy key, because the panel prints these and every word on this
    desktop goes through the copy layer. */
export type AnatomyNode = {
  id: string
  name: string
  /** the role PREFIXES this node paints, component id already stripped */
  roles?: readonly string[]
  children?: readonly AnatomyNode[]
}

/* The five pilots. Order inside a node is the order the panel draws it, which
   is DOM order wherever the DOM has one — a person reading the tree should be
   able to point at the bench and find the same thing in the same place. */
export const ANATOMY: Record<string, AnatomyNode> = {
  /* The tone and size axes stay on the root on purpose. --button-sm-border and
     --button-md-padding-x are not two parts of a button, they are one part
     under two settings, and a SM node beside an MD node would be offering a
     drill into something the bench cannot show you separately. The label is
     the one real child: it is the only thing inside the box, and the two text
     roles are the only rows that paint it. */
  button: {
    id: 'button',
    name: 'styler.layer.button.button',
    children: [{ id: 'label', name: 'styler.layer.button.label', roles: ['sm-text', 'md-text'] }],
  },

  'desktop-icons': {
    id: 'desktop-icons',
    name: 'styler.layer.desktop-icons.desktop-icons',
    // the grid itself: the cell it lays out, the gaps between cells, the line
    roles: ['border-width', 'cell-width', 'gap'],
    children: [
      {
        id: 'icon',
        name: 'styler.layer.desktop-icons.icon',
        // hover is the icon button's, not the grid's: the fill and the line
        // that appear under the pointer are painted on the button
        roles: ['icon-btn', 'hover'],
        children: [
          { id: 'label', name: 'styler.layer.desktop-icons.label', roles: ['label-text'] },
        ],
      },
    ],
  },

  menubar: {
    id: 'menubar',
    name: 'styler.layer.menubar.menubar',
    roles: ['bg', 'border', 'gap', 'h', 'padding-x', 'text'],
    children: [
      {
        id: 'wordmark',
        name: 'styler.layer.menubar.wordmark',
        roles: ['wordmark'],
        children: [
          { id: 'version', name: 'styler.layer.menubar.version', roles: ['wordmark-version'] },
        ],
      },
      /* Three buttons, one set of rows. The bar's left and right wrappers are
         not here: they carry no token and no marker, and a layer that paints
         nothing is a row that can only disappoint the person who opens it. */
      { id: 'sound', name: 'styler.layer.menubar.sound', roles: ['menu-btn', 'menu-glyph-btn'] },
      { id: 'theme', name: 'styler.layer.menubar.theme', roles: ['menu-btn', 'menu-glyph-btn'] },
      {
        id: 'palette',
        name: 'styler.layer.menubar.palette',
        roles: ['menu-btn', 'menu-glyph-btn'],
      },
    ],
  },

  /* One node, and the pink rows sit on it. A pink stamp is the same element
     wearing a second class, so PINK was never a part — the derivation made it
     one because the token names said `stamp-pink-fg`, and the marker that
     followed pointed at the root element with a different word on it. */
  stamp: { id: 'stamp', name: 'styler.layer.stamp.stamp' },

  window: {
    id: 'window',
    name: 'styler.layer.window.window',
    children: [
      {
        id: 'titlebar',
        name: 'styler.layer.window.titlebar',
        roles: ['titlebar'],
        children: [
          {
            id: 'controls',
            name: 'styler.layer.window.controls',
            roles: ['title-controls'],
            children: [
              { id: 'close', name: 'styler.layer.window.close', roles: ['ctrl'] },
              { id: 'zoom', name: 'styler.layer.window.zoom', roles: ['ctrl'] },
            ],
          },
          { id: 'title', name: 'styler.layer.window.title', roles: ['title-text'] },
          { id: 'explainer', name: 'styler.layer.window.explainer', roles: ['explainer'] },
          { id: 'meta', name: 'styler.layer.window.meta', roles: ['title-meta'] },
        ],
      },
      /* The body and the grip take no tokens today and they are still layers.
         They are half the window on screen, a visitor looking for "where does
         the body's background come from" needs to land somewhere and be told
         the honest answer, and the day one of them earns a row the row has a
         home already. */
      { id: 'body', name: 'styler.layer.window.body' },
      { id: 'grip', name: 'styler.layer.window.grip' },
    ],
  },
}

/** The tree for a component, or a bare root for an id no pilot declares —
    the panel always has something to draw and the rows always have somewhere
    to land. */
export function anatomyOf(id: string): AnatomyNode {
  return ANATOMY[id] ?? { id, name: `styler.layer.${id}.${id}` }
}
