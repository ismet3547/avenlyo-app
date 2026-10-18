"use client";
import {useActionState} from "react";
import {createWorkspace} from "@/app/workspaces/actions";
import type {FormState} from "@/app/auth/actions";
export function SkeletonWorkspaceForm(){const[state,action,pending]=useActionState(createWorkspace,{message:"",status:"idle"} as FormState);return <form action={action} className="skeleton-form"><label>Business name<input name="name" minLength={2} maxLength={100} placeholder="Northstar Studio" required/></label>{state.message&&<p role="status" className={state.status==="error"?"skeleton-form-message skeleton-form-error":"skeleton-form-message"}>{state.message}</p>}<button type="submit" disabled={pending}>{pending?"Creating…":"Create workspace"}</button></form>}