import {
	CubicBezier2d,
	Geometry2d,
	HTMLContainer,
	RecordProps,
	ShapeUtil,
	TLBaseShape,
	TLHandle,
	TLHandleDragInfo,
	Tldraw,
	Vec,
	VecLike,
	ZERO_INDEX_KEY,
	getIndicesAbove,
	vecModelValidator,
} from 'tldraw'
import 'tldraw/tldraw.css'

// [1]
type BezierPathShape = TLBaseShape<
	'bezier-path',
	{
		start: VecLike
		cp1: VecLike
		cp2: VecLike
		end: VecLike
	}
>

// [2]
class BezierPathUtil extends ShapeUtil<BezierPathShape> {
	static override type = 'bezier-path' as const
	static override props: RecordProps<BezierPathShape> = {
		start: vecModelValidator,
		cp1: vecModelValidator,
		cp2: vecModelValidator,
		end: vecModelValidator,
	}

	override getDefaultProps(): BezierPathShape['props'] {
		return {
			start: { x: 0, y: 0 },
			cp1: { x: 50, y: 100 },
			cp2: { x: 150, y: 100 },
			end: { x: 200, y: 0 },
		}
	}

	override canEdit(): boolean {
		return true
	}

	override hideSelectionBoundsBg(): boolean {
		return true
	}

	override hideSelectionBoundsFg(): boolean {
		return true
	}

	override hideResizeHandles(): boolean {
		return true
	}

	override hideRotateHandle(): boolean {
		return true
	}

	// [3]
	getGeometry(shape: BezierPathShape): Geometry2d {
		const { start, cp1, cp2, end } = shape.props
		return new CubicBezier2d({
			start: Vec.From(start),
			cp1: Vec.From(cp1),
			cp2: Vec.From(cp2),
			end: Vec.From(end),
		})
	}

	// [4]
	override getHandles(shape: BezierPathShape): TLHandle[] {
		const indices = [ZERO_INDEX_KEY, ...getIndicesAbove(ZERO_INDEX_KEY, 3)]

		return [
			{
				id: 'start',
				type: 'vertex',
				x: shape.props.start.x,
				y: shape.props.start.y,
				index: indices[0],
			},
			{
				id: 'cp1',
				type: 'vertex',
				x: shape.props.cp1.x,
				y: shape.props.cp1.y,
				index: indices[1],
				// [5]
				snapReferenceHandleId: 'start',
			},
			{
				id: 'cp2',
				type: 'vertex',
				x: shape.props.cp2.x,
				y: shape.props.cp2.y,
				index: indices[2],
				// [6]
				snapReferenceHandleId: 'end',
			},
			{
				id: 'end',
				type: 'vertex',
				x: shape.props.end.x,
				y: shape.props.end.y,
				index: indices[3],
			},
		]
	}

	override onHandleDrag(shape: BezierPathShape, info: TLHandleDragInfo<BezierPathShape>) {
		const { handle } = info
		return {
			...shape,
			props: {
				...shape.props,
				[handle.id]: { x: handle.x, y: handle.y },
			},
		}
	}

	// [7]
	component(shape: BezierPathShape) {
		const { start, cp1, cp2, end } = shape.props
		const path = this.getGeometry(shape).getSvgPathData(true)
		const zoomLevel = this.editor.getZoomLevel()

		return (
			<HTMLContainer>
				<svg className="tl-svg-container">
					<path d={path} stroke="black" strokeWidth={2} fill="transparent" />
					{this.shouldShowControlLines(shape) && (
						<>
							<line
								x1={start.x}
								y1={start.y}
								x2={cp1.x}
								y2={cp1.y}
								stroke="black"
								strokeWidth={1 / zoomLevel}
								strokeDasharray={`${6 / zoomLevel} ${6 / zoomLevel}`}
								opacity={0.5}
							/>
							<line
								x1={end.x}
								y1={end.y}
								x2={cp2.x}
								y2={cp2.y}
								stroke="black"
								strokeWidth={1 / zoomLevel}
								strokeDasharray={`${6 / zoomLevel} ${6 / zoomLevel}`}
								opacity={0.5}
							/>
						</>
					)}
				</svg>
			</HTMLContainer>
		)
	}

	indicator(shape: BezierPathShape) {
		const path = this.getGeometry(shape).getSvgPathData(true)
		return <path d={path} />
	}

	private shouldShowControlLines(shape: BezierPathShape) {
		const selectedShape = this.editor.getOnlySelectedShape() === shape
		if (!selectedShape) return false

		return this.editor.isInAny(
			'select.idle',
			'select.editing_shape',
			'select.pointing_handle',
			'select.dragging_handle',
			'select.translating'
		)
	}
}

const customShapes = [BezierPathUtil]

export default function CustomRelativeSnappingExample() {
	return (
		<div className="tldraw__editor">
			<Tldraw
				shapeUtils={customShapes}
				onMount={(editor) => {
					const viewportPageBounds = editor.getViewportPageBounds()
					const centerX = viewportPageBounds.center.x
					const centerY = viewportPageBounds.center.y

					editor.createShape({
						type: 'bezier-path',
						x: centerX - 100,
						y: centerY - 50,
					})

					const shapeId = editor.getCurrentPageShapeIds().values().next().value
					if (shapeId) {
						editor.select(shapeId)
					}
				}}
			/>
		</div>
	)
}

/*
This example demonstrates the `snapReferenceHandleId` property with a cubic bezier curve.

The shape has a bezier curve structure with:
- start (anchor point)
- cp1 (control point)
- cp2 (control point)
- end (anchor point)

[1]
Define the shape type with four points that represent a bezier-like structure.

[2]
The shape util with validators for type safety.

[3]
Use CubicBezier2d geometry for a cubic bezier curve

[4]
Four handles in array order: [start, cp1, cp2, end]

[5]
Without `snapReferenceHandleId: 'start'`, when you 'shift+drag' cp1,
the default snapping logic would find the next adjacent handle, which is cp2 when we want it to snap to start.

[6]
Similarly, cp2 uses `snapReferenceHandleId: 'end'`. It would work correctly without this 
property but setting it makes the intent clear and prevents issues if handles are reordered.

*/
